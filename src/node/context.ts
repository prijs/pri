const contextWrapper = {
  context: {}
};

export const pipe = (callback: (prevContext: any) => any) => {
  const nextContext = callback(contextWrapper.context);
  contextWrapper.context = nextContext;
};

export const get = () => contextWrapper.context as any;
