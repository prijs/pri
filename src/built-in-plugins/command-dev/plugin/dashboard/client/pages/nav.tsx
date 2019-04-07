import * as React from 'react';

export const NavComponent = React.memo(() => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexGrow: 1,
        paddingLeft: 10,
        paddingRight: 10,
        fontWeight: 'bold',
        color: '#999'
      }}
    >
      <span>Pri dashboard</span>
      <a style={{ marginLeft: 5 }} href="https://github.com/prijs/pri" target="_blank" rel="noopener noreferrer">
        Docs
      </a>
    </div>
  );
});
