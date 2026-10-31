import json
import sys

print(json.dumps({"runtime": "python", "version": sys.version.split()[0], "argument": sys.argv[1] if len(sys.argv) > 1 else ""}))
