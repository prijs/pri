import styled from 'styled-components';

export const Container = styled.div`
  background-color: whitesmoke;
  width: 100vw;
  height: 100vh;
  display: flex;
  padding: 10px;
`;

export const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 300px;
`;

export const RightContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding-left: 10px;
`;

export const DocInstanceContainer = styled.div`
  width: 100%;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  flex-grow: 1;
  flex-basis: 0;
  overflow-y: auto;
`;

export const DocInfoContainer = styled.div`
  height: 200px;
  background-color: white;
  min-height: 200px;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 3px;
  margin-top: 10px;
`;

export const DocMenuItem = styled.div`
  display: flex;
  align-items: center;
  height: 30px;
  cursor: pointer;
  border-radius: 5px;
  padding-left: 10px;
  &:hover {
    background-color: white;
  }
  ${props =>
    props.theme.active &&
    `
    background-color: white;
  `};
`;
