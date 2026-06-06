import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { apiUrl } from '../utils/api'

function GoogleLoginButton() {
  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        apiUrl('/api/auth/google'),
        {
          token: credentialResponse.credential,
        },
        { withCredentials: true }
      )

      console.log(res.data)

      alert('Login Success')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {
        console.log('Login Failed')
      }}
    />
  )
}

export default GoogleLoginButton