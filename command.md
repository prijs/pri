# init

- import()
  - ensureProjectFiles
  - checkProjectFiles

# dev

- import()
  - ensureProjectFiles
  - checkProjectFiles
  - analyseProject
  - createEntry

# build

- import()
  - cleanDist
  - ensureProjectFiles
  - lint
  - checkProjectFiles
  - **pure build**

# bundle

- import()
  - ensureProjectFiles
  - lint
  - checkProjectFiles

# analyse

- import()
  - analyseProject
  - createEntry

# docs

- import()
  - ensureProjectFiles
  - checkProjectFiles
  - analyseProject

# preview

- import()
  - **pure build**
  - **pure preview**

# test

- lint
- ensureProjectFiles
- checkProjectFiles
- import()
  - **pure test**

# publish

- import()
  - lint
  - **pure build**
  - **pure bundle**