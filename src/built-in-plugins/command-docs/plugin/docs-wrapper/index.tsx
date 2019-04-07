import * as React from 'react';

const urlSearchParams = new URLSearchParams(window.location.search);

export class Props {
  public docs?: { name: string; element: any; text: string }[] = [];
}

export const Docs = React.memo((props: Props) => {
  const [docIndex, setDocIndex] = React.useState(0);

  function selectDoc(index: number) {
    urlSearchParams.set('index', index.toString());
    const newurl = `${window.location.protocol}//${window.location.host}${
      window.location.pathname
    }?${urlSearchParams.toString()}`;
    window.history.pushState({ path: newurl }, '', newurl);

    setDocIndex(index);
  }

  function renderLeftMenus() {
    return props.docs.map((doc, index) => {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 30,
            cursor: 'pointer',
            paddingLeft: 10,
            boxSizing: 'border-box',
            backgroundColor: docIndex === index ? 'white' : null,
            fontSize: 14,
            color: '#333',
            borderBottom: '1px solid #eee'
          }}
          onClick={() => selectDoc(index)}
          key={index}
        >
          {doc.name}
        </div>
      );
    });
  }

  if (props.docs.length === 0) {
    return null;
  }

  const currentDoc = props.docs[docIndex];
  const DocInstance = currentDoc.element.default;

  return (
    <div
      style={{
        backgroundColor: 'whitesmoke',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        boxSizing: 'border-box'
      }}
    >
      {props.docs.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 200,
            minWidth: 200,
            borderRight: '1px solid #eee',
            boxSizing: 'border-box'
          }}
        >
          {renderLeftMenus()}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, boxSizing: 'border-box' }}>
        <div
          style={{
            width: '100%',
            backgroundColor: 'white',
            flexGrow: 1,
            flexBasis: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <DocInstance />
        </div>
      </div>
    </div>
  );
});
