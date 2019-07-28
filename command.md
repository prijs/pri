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

- prepareBuild
  - cleanDist
  - ensureProjectFiles
  - lint
  - checkProjectFiles
- import()
  - **pure build**

# bundle

- prepareBundle
  - ensureProjectFiles
  - lint
  - checkProjectFiles
- import()
  - **pure bundle**
  
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