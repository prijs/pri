import styled from 'styled-components'
import * as React from 'react'
import { Icon } from 'antd'

export const MenuIcon = (props: any) => (
  <Icon style={{ fontSize: 15, marginRight: 10 }} {...props} />
)

export const Container = styled.div`
  display: flex;
`

export const Button = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
  border-right: 1px solid #eee;
  padding: 0 10px;
  cursor: pointer;
  transition: background-color .2s;
  &:hover {
    background-color: whitesmoke;
  }
`