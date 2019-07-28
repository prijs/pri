import * as React from 'react';

const urlSearchParams = new URLSearchParams(window.location.search);

export class Props {
  public docs?: { name: string; element: any; text: string }[] = [];
}

const Docs = React.memo((props: Props) => {
  const [docName, setDocName] = React.useState(null);

  React.useEffect(() => {
    const name = urlSearchParams.get('name');
    if (docName !== name) {
      setDocName(name);
    }
  }, [docName]);

  const selectDoc = React.useCallback((name: string) => {
    urlSearchParams.set('name', name);

    const newurl = `${window.location.protocol}//${window.location.host}${
      window.location.pathname
    }?${urlSearchParams.toString()}`;

    window.history.pushState({ path: newurl }, '', newurl);

    setDocName(name);
  }, []);

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
            backgroundColor: docName === index ? 'white' : null,
            fontSize: 14,
            color: '#333',
            borderBottom: '1px solid #eee',
          }}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => {
            selectDoc(doc.name);
          }}
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

  const currentDoc = !docName
    ? props.docs[0]
    : props.docs.find(eachDoc => {
        return eachDoc.name === docName;
      });
  const DocInstance = currentDoc.element.default;

  return (
    <div
      style={{
        backgroundColor: 'whitesmoke',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        boxSizing: 'border-box',
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
            boxSizing: 'border-box',
          }}
        >
          {renderLeftMenus()}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            backgroundColor: 'white',
            flexGrow: 1,
            flexBasis: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <DocInstance />
        </div>
      </div>
    </div>
  );
});

export default Docs;
