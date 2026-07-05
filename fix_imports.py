import os
import sys

# Ensure backend directory is on path
root = os.path.dirname(os.path.abspath(__file__))
if root not in sys.path:
    sys.path.insert(0, root)

router_dir = os.path.join(root, 'backend', 'routers')
files = [f for f in os.listdir(router_dir) if f.endswith('.py') and f != '__init__.py']

for filename in files:
    filepath = os.path.join(router_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    # Replace relative imports with absolute ones
    updated = content.replace('from ..database', 'from backend.database')
    updated = updated.replace('from ..models', 'from backend.models')
    updated = updated.replace('from ..config', 'from backend.config')
    updated = updated.replace('from ..services', 'from backend.services')
    updated = updated.replace('from .auth', 'from backend.routers.auth')
    updated = updated.replace('from .data', 'from backend.routers.data')
    updated = updated.replace('from .dashboard', 'from backend.routers.dashboard')
    
    if updated != content:
        with open(filepath, 'w', encoding='utf-8') as fh:
            fh.write(updated)
        print(f"Fixed: {filename}")
    else:
        print(f"No change: {filename}")

# Fix services too
services_dir = os.path.join(root, 'backend', 'services')
svc_files = [f for f in os.listdir(services_dir) if f.endswith('.py') and f != '__init__.py']
for filename in svc_files:
    filepath = os.path.join(services_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as fh:
        content = fh.read()
    updated = content.replace('from ..models', 'from backend.models')
    updated = updated.replace('from ..database', 'from backend.database')
    if updated != content:
        with open(filepath, 'w', encoding='utf-8') as fh:
            fh.write(updated)
        print(f"Fixed service: {filename}")

print("All imports fixed!")
