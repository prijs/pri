export const pipeEvent = (func: any) => {
  return (event: any) => {
    return func(event.target.value, event);
  };
};
