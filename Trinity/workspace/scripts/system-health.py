# Trinity Workspace Script: system-health.py
# Inspects Python environment, platform and resource status.

import json
import os
import platform
import sys
import time

def run():
    result = {
        "service": "Trinity Python Health Monitor",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "python": {
            "version": platform.python_version(),
            "implementation": platform.python_implementation(),
            "executable": sys.executable,
            "encoding": sys.getdefaultencoding()
        },
        "platform": {
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
            "cpu_count": os.cpu_count() or 1
        },
        "environment": {
            "cwd": os.getcwd(),
            "ci_mode": os.environ.get("CI", "0") == "1",
            "no_color": os.environ.get("NO_COLOR", "0") == "1"
        },
        "status": "ready"
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    run()
