/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Conferma la modifica email per {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Conferma la modifica email</Heading>
        <Text style={text}>
          Hai richiesto di cambiare il tuo indirizzo email per {siteName} da{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          a{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Clicca il pulsante qui sotto per confermare la modifica:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Conferma Modifica Email
        </Button>
        <Text style={footer}>
          Se non hai richiesto questa modifica, proteggi il tuo account immediatamente.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(265, 4%, 12.9%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(257, 4.6%, 55.4%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(266, 4%, 20.8%)',
  color: 'hsl(248, 0.3%, 98.4%)',
  fontSize: '14px',
  borderRadius: '0.375rem',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
