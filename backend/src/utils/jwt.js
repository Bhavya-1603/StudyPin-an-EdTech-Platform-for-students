import jwt from 'jsonwebtoken'

export const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
      issuer: 'studypin',
      audience: 'studypin-client'
    }
  )
}

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'studypin',
    audience: 'studypin-client'
  })
}