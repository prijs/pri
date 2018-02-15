import styled, { injectGlobal } from 'styled-components'

injectGlobal`
  * {
    font-size: 12px;
    &::-webkit-scrollbar {
      width: 1px;
      height: 1px;
    }
    &::-webkit-scrollbar-track {}
    &::-webkit-scrollbar-thumb {
      border-radius: 1px;
      background: #ccc;
    }
  }
`

export const Container = styled.div`
  display: flex;
  height: 100%;
`

export const ContainerLeft = styled.div`
  display: flex;
  flex-direction: column;
  width: 250px;
  border-right: 1px solid #eee;
`

export const ContainerRight = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-basis: 0;
`

export const TopContainer = styled.div`
  display: flex;
  height: 40px;
  border-bottom: 1px solid #eee;
`

export const BottomContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-basis: 0;
`