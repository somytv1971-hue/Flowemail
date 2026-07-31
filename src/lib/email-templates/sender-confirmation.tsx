import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  senderName?: string
  email?: string
  confirmUrl?: string
}

const Email = ({ senderName, email, confirmUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm {email ?? 'your email address'} to start sending with Flowmail</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Flowmail</Text>
        <Heading style={heading}>Confirm your sender address</Heading>
        <Text style={text}>
          {senderName ? `Hi ${senderName},` : 'Hi there,'}
        </Text>
        <Text style={text}>
          You added <strong>{email ?? 'this address'}</strong> as a sender address in Flowmail.
          Confirm it to start sending campaigns and automation messages from it.
        </Text>
        {confirmUrl ? (
          <Section style={{ margin: '28px 0' }}>
            <Button href={confirmUrl} style={button}>
              Confirm this address
            </Button>
          </Section>
        ) : null}
        <Text style={muted}>
          If you didn't add this address, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Confirm your sender address',
  displayName: 'Sender address confirmation',
  previewData: {
    senderName: 'Tangail Model',
    email: 'hello@digitalgoodsmart.xyz',
    confirmUrl: 'https://example.com/confirm',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '14px', fontWeight: 700, color: '#4f46e5', letterSpacing: '0.08em' }
const heading = { fontSize: '24px', color: '#111827', margin: '8px 0 16px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#374151' }
const muted = { fontSize: '13px', lineHeight: '20px', color: '#6b7280' }
const button = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  borderRadius: '9999px',
  padding: '12px 24px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
}
