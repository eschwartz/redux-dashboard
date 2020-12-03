
while read p; do
  line=( $p )
  repo=${line[0]}
  student=${line[1]}
  grade=${line[2]}

  # Cleanup git working tree
  git reset --hard HEAD
  git co -- .
  git clean -fd

  # Add student repo as a remote
  git remote remove student || true
  git remote add student ${repo}

  # Checkout student code
  git fetch student
  git checkout student/master src
  git reset --mixed HEAD

  # Run tests
  npm run test

  cp testResults.html ./results/${student}-${grade}.html
done <student-repos