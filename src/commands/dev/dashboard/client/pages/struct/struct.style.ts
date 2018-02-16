import styled from "styled-components"

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
`

export const SearchContainer = styled.div`
  display: flex;
  height: 30px;
  min-height: 30px;
`

export const TreeContainer = styled.div`
  overflow-y: auto;
`

export const PlusIconContainer = styled.span`
  transition: all .2s;
  margin-right: 5px;
  &:hover{
    background-color: whitesmoke;
  }
`
