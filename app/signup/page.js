// app/signup/page.js
import SignUpForm from './SignUpForm';
import AppAppBar from '../home-page/components/AppAppBar';
import Footer from '../home-page/components/Footer';

export default function SignUpPage() {
  return (
    <>
      <AppAppBar/>
      <SignUpForm/>
      <Footer/>
    </>
  )
}
