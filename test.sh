#!/usr/bin/env bash

# Failing tests should make this script fail,
# in a CI environment.
if [[ -n "$CI" ]]; then
  set -e
fi

# Run the tests
react-scripts test \
  --env=jsdom \
  ${testNamePatternFlag} \
  --reporters=./tests/reporter/reporter.js \
  --no-color \
  --watchAll=false

# If we're running from Github Actions, show a "All tested passed!"
# message in the workflow annotations
if [[ -n "$CI" ]]; then
  echo "::warning::All tests passed! Great work!"
# If we're running locally, open the HTML report
# Uses our custom reporter
else
  echo "Testing complete!"
  open ./testResults.html
fi