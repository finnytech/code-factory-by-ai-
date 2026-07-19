#!/usr/bin/env python3
import datetime
import time

def generate_prompt():
    prompt = """
    [System Message - Continuous Agent Prompt (30-Minute Cron Loop)]
    Time: {time}

    You are an AI agent operating in a 30-minute cron loop. Your objective is to continue working on an existing subproject within this repository (https://github.com/finnytech/factory-of-code-by-ai-).

    Instructions for this cycle:
    1. Select an existing project subfolder.
    2. Analyze the current codebase.
    3. Create a new plan to update, debug, test, and optimize the existing code. Review the plan yourself.
    4. Implement the plan. Add new features, refactor, debug, or optimize. Use your creativity to keep the project evolving with unique, diverse concepts (e.g., cyber, exotic, professional, high-tech, games, productivity tools) and multiple technologies (e.g., C++, Python, Vue, JS, HTML).
    5. Test thoroughly to ensure everything works perfectly.
    6. Ensure all additions strictly adhere to safety and legal guidelines and the Apache 2.0 license.
    7. Submit and push the updated code to the public repository.
    """
    print(prompt.format(time=datetime.datetime.now().isoformat()))

if __name__ == "__main__":
    while True:
        generate_prompt()
        print("Sleeping for 30 minutes (1800 seconds)...")
        time.sleep(30 * 60)
