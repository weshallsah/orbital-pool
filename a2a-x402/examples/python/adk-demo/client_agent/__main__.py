#!/usr/bin/env python3
# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import asyncio
import uvicorn
from .agent import root_agent

async def main():
    """Start the client agent server."""
    try:
        # Try to use the proper A2A server creation
        from a2a.server.apps.rest.fastapi_app import FastAPIApp
        app = FastAPIApp(root_agent).app
    except ImportError:
        # Fallback to basic FastAPI
        from fastapi import FastAPI
        app = FastAPI()
        
        @app.get("/")
        async def root():
            return {"message": "A2A Client Agent"}
        
        # Mount the agent at /agent
        try:
            app.mount("/agent", root_agent)
        except Exception as e:
            print(f"Could not mount agent: {e}")
    
    config = uvicorn.Config(app, host="127.0.0.1", port=59121, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
