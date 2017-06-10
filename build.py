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

def packageProperty(name):
    file = open('package.json')
    data = json.load(file)
    value = data[name]
    file.close()
    return value

# Symbolic constants for the project structure.
DIST_DIR        = 'dist'
TEST_DIR        = 'test'

# Symbolic constants for the naming of distribution files.
PRODUCT_NAME    = packageProperty("name")
OUTFILE_REG     = "{0}.js".format(PRODUCT_NAME)
OUTFILE_MIN     = "{0}.min.js".format(PRODUCT_NAME)
OUTFILE_LIB     = "{0}-stdlib.js".format(PRODUCT_NAME)
OUTFILE_MAP     = "{0}-linemap.txt".format(PRODUCT_NAME)

# Symbolic constants for file types.
FILE_TYPE_DIST = 'dist'
FILE_TYPE_TEST = 'test'

def gen():
    """regenerate the parser/ast source code"""
    if not os.path.exists("src/cst"): os.mkdir("src/cst")
    os.chdir("src/pgen/parser")
    os.system("python main.py ../../../src/cst/tables.ts")
    os.chdir("../../..")

def usageString(program):
    return '''

    {program} <command> [<options>] [script.py]

Commands:

    gen              Regenerate parser

    help             Display help information

Options:

    -q, --quiet        Only output important information.
    -s, --silent       Do not output anything, besides errors.
    -v, --verbose      Make output more verbose [default].
    --version          Returns the version string in package.json file.
'''.format(program=program)

def main():
    parser = OptionParser(usageString("%prog"), version="%prog {0}".format(packageProperty("version")))
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

    if cmd == "gen":
        gen()
    else:
        print usageString(os.path.basename(sys.argv[0]))
        sys.exit(2)

if __name__ == "__main__":
    main()
