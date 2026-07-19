# Plan

1. **Update Cron Script**: Use `write_file` to overwrite `cron_agent.py` with a Python script that runs a 30-minute loop, outputting a neutrally rephrased prompt instructing the agent to work on an existing project (updating, debugging, testing, optimizing), while adhering to safe, legal, and unique guidelines.
2. **Verify Cron Update**: Use `run_in_bash_session` with `python3 -m py_compile cron_agent.py && cat cron_agent.py` to confirm the update is syntactically valid and contains the expected changes.
3. **Create New Project**: Use `run_in_bash_session` to `mkdir -p nebula-drift-vue` and use `write_file` to create `nebula-drift-vue/index.html` and `nebula-drift-vue/app.js` for an exotic high-tech space nebula visualization using Vue.js.
4. **Verify Creation**: Use `run_in_bash_session` with `ls -la nebula-drift-vue` to verify that the newly created project files exist.
5. **Create Tests**: Use `write_file` to create a basic Node.js test script `nebula-drift-vue/test.js` to verify the logic and structure of the Vue.js app files.
6. **Execute Tests**: Use `run_in_bash_session` to run `node nebula-drift-vue/test.js` to ensure the new project logic works and passes tests.
7. **Pre-commit**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
8. **Submit**: Use the `submit` tool to commit and push the new project and the cron updates to the repository.