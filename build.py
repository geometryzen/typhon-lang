#!/usr/bin/env python2.7

#
#   Note:  python2.6 is specified because that is what the skulpt parser
#          used as a reference.  This is only important when you are doing
#          things like regenerating tests and/or regenerating symtabs
#          If you do not have python 2.6 and you ARE NOT creating new tests
#          then all should be well for you to use 2.7 or whatever you have around

from optparse import OptionParser
from subprocess import Popen, PIPE
import os
import sys
import glob
import py_compile
import symtable
import shutil
import re
import pprint
import json

# Assume that the GitPython module is available until proven otherwise.
GIT_MODULE_AVAILABLE = True
try:
    from git import *
except:
    GIT_MODULE_AVAILABLE = False

def bowerFileName():
    file = open(".bowerrc")
    data = json.load(file)
    fileName = data["json"]
    file.close()
    return fileName

def bowerProperty(name):
    file = open(bowerFileName())
    data = json.load(file)
    value = data[name]
    file.close()
    return value

# Symbolic constants for the project structure.
DIST_DIR        = 'dist'
TEST_DIR        = 'test'

# Symbolic constants for the naming of distribution files.
PRODUCT_NAME    = bowerProperty("name")
OUTFILE_REG     = "{0}.js".format(PRODUCT_NAME)
OUTFILE_MIN     = "{0}.min.js".format(PRODUCT_NAME)
OUTFILE_LIB     = "{0}-stdlib.js".format(PRODUCT_NAME)
OUTFILE_MAP     = "{0}-linemap.txt".format(PRODUCT_NAME)

# Symbolic constants for file types.
FILE_TYPE_DIST = 'dist'
FILE_TYPE_TEST = 'test'

def gen():
    """regenerate the parser/ast source code"""
    if not os.path.exists("src/pytools"): os.mkdir("src/pytools")
    os.chdir("src/pgen/parser")
    os.system("python main.py ../../../src/pytools/tables.ts")
    os.chdir("../ast")
    # os.system("python asdl_js.py Python.asdl ../../../src/pytools/astnodes-generated.js")
    os.chdir("../../..")

def regenasttests(togen="{0}/run/*.py".format(TEST_DIR)):
    """regenerate the ast test files by running our helper script via real python"""
    for f in glob.glob(togen):
        transname = f.replace(".py", ".trans")
        os.system("python {0}/astppdump.py {1} > {2}".format(TEST_DIR, f, transname))
        forcename = f.replace(".py", ".trans.force")
        if os.path.exists(forcename):
            shutil.copy(forcename, transname)
        if crlfprog:
            os.system("python {0} {1}".format(crlfprog, transname))


def regenruntests(togen="{0}/run/*.py".format(TEST_DIR)):
    """regenerate the test data by running the tests on real python"""
    for f in glob.glob(togen):
        os.system("python {0} > {1}.real 2>&1".format(f, f))
        forcename = f + ".real.force"
        if os.path.exists(forcename):
            shutil.copy(forcename, "%s.real" % f)
        if crlfprog:
            os.system("python %s %s.real" % (crlfprog, f))
    for f in glob.glob("{0}/interactive/*.py".format(TEST_DIR)):
        p = Popen("python -i > %s.real 2>%s" % (f, nul), shell=True, stdin=PIPE)
        p.communicate(open(f).read() + "\004")
        forcename = f + ".real.force"
        if os.path.exists(forcename):
            shutil.copy(forcename, "%s.real" % f)
        if crlfprog:
            os.system("python %s %s.real" % (crlfprog, f))



def symtabdump(fn):
    if not os.path.exists(fn):
        print "%s doesn't exist" % fn
        raise SystemExit()
    text = open(fn).read()
    mod = symtable.symtable(text, os.path.split(fn)[1], "exec")
    def getidents(obj, indent=""):
        ret = ""
        ret += """%sSym_type: %s
%sSym_name: %s
%sSym_lineno: %s
%sSym_nested: %s
%sSym_haschildren: %s
""" % (
        indent, obj.get_type(),
        indent, obj.get_name(),
        indent, obj.get_lineno(),
        indent, obj.is_nested(),
        indent, obj.has_children())
        if obj.get_type() == "function":
            ret += "%sFunc_params: %s\n%sFunc_locals: %s\n%sFunc_globals: %s\n%sFunc_frees: %s\n" % (
                    indent, sorted(obj.get_parameters()),
                    indent, sorted(obj.get_locals()),
                    indent, sorted(obj.get_globals()),
                    indent, sorted(obj.get_frees()))
        elif obj.get_type() == "class":
            ret += "%sClass_methods: %s\n" % (
                    indent, sorted(obj.get_methods()))
        ret += "%s-- Identifiers --\n" % indent
        for ident in sorted(obj.get_identifiers()):
            info = obj.lookup(ident)
            ret += "%sname: %s\n  %sis_referenced: %s\n  %sis_imported: %s\n  %sis_parameter: %s\n  %sis_global: %s\n  %sis_declared_global: %s\n  %sis_local: %s\n  %sis_free: %s\n  %sis_assigned: %s\n  %sis_namespace: %s\n  %snamespaces: [\n%s  %s]\n" % (
                    indent, info.get_name(),
                    indent, info.is_referenced(),
                    indent, info.is_imported(),
                    indent, info.is_parameter(),
                    indent, info.is_global(),
                    indent, info.is_declared_global(),
                    indent, info.is_local(),
                    indent, info.is_free(),
                    indent, info.is_assigned(),
                    indent, info.is_namespace(),
                    indent, '\n'.join([getidents(x, indent + "    ") for x in info.get_namespaces()]),
                    indent
                    )
        return ret
    return getidents(mod)

def regensymtabtests(togen="{0}/run/*.py".format(TEST_DIR)):
    """regenerate the test data by running the symtab dump via real python"""
    for fn in glob.glob(togen):
        outfn = "%s.symtab" % fn
        f = open(outfn, "wb")
        f.write(symtabdump(fn))
        f.close()

def usageString(program):
    return '''

    {program} <command> [<options>] [script.py]

Commands:

    gen              Regenerate parser
    regenasttests    Regen abstract symbol table tests
    regenruntests    Regenerate runtime unit tests
    regensymtabtests Regenerate symbol table tests
    regentests       Regenerate all of the above

    help             Display help information

Options:

    -q, --quiet        Only output important information.
    -s, --silent       Do not output anything, besides errors.
    -v, --verbose      Make output more verbose [default].
    --version          Returns the version string in Bower configuration file.
'''.format(program=program)

def main():
    parser = OptionParser(usageString("%prog"), version="%prog {0}".format(bowerProperty("version")))
    parser.add_option("-q", "--quiet",        action="store_false", dest="verbose")
    parser.add_option("-s", "--silent",       action="store_true",  dest="silent",       default=False)
    parser.add_option("-v", "--verbose",
        action="store_true",
        dest="verbose",
        default=False,
        help="Make output more verbose [default].")
    (options, args) = parser.parse_args()

    # This is rather aggressive. Do we really want it?
    if options.verbose:
        if sys.platform == 'win32':
            os.system("cls")
        else:
            os.system("clear")

    if len(sys.argv) < 2:
        cmd = "help"
    else:
        cmd = sys.argv[1]

    if cmd == "regentests":
        if len(sys.argv) > 2:
            togen = "{0}/run/".format(TEST_DIR) + sys.argv[2]
        else:
            togen = "{0}/run/*.py".format(TEST_DIR)
        print "generating tests for ", togen
        regensymtabtests(togen)
        regenasttests(togen)
        regenruntests(togen)
    elif cmd == "regensymtabtests":
        regensymtabtests()
    elif cmd == "gen":
        gen()
    elif cmd == "regenasttests":
        regenasttests()
    elif cmd == "regenruntests":
        regenruntests()
    else:
        print usageString(os.path.basename(sys.argv[0]))
        sys.exit(2)

if __name__ == "__main__":
    main()
