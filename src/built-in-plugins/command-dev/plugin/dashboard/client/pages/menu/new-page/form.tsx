import { Button, TextField } from '@material-ui/core';
import * as React from 'react';
import { SocketContext } from '../../../utils/context';

export default React.memo((props: { onSuccess: () => void }) => {
  const [pathName, setPathName] = React.useState('');
  const socket = React.useContext(SocketContext);

  const handleChangePathName = React.useCallback((event: any) => {
    setPathName(event.target.value);
  }, []);

  const handleSubmit = React.useCallback(() => {
    socket.emit('addPage', pathName);

    props.onSuccess();
  }, [pathName, props, socket]);

  return (
    <div>
      <TextField value={pathName} onChange={handleChangePathName} />

      <Button color="primary" onClick={handleSubmit}>
        Ok
      </Button>
    </div>
  );
});
