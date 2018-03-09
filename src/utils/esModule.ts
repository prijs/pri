export const getDefault = <T>(instance: any) => {
  if (instance.default) {
    return instance.default as T
  }

  return instance as T
}
