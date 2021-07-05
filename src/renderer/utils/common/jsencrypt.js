
import JSEncrypt from 'jsencrypt/bin/jsencrypt'
// import CryptoJS from 'crypto-js'
const base64code = require('js-base64').Base64
import crypto from 'crypto'
// var publicKey = ''
// switch (process.env.ENV_CONFIG) {
// 	case 'dev':
// 		publicKey = 'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAJaS3fMH5URCweA2G6jnhEL/KU9vjUS/RMXiBPpQ7UL9OiJps5azYaQ8qWy90//7A3aFpcW+t4REV2j7SMXf5/x1lneFw4+Ixl1IJhEZHCPMbsqcLXM9A2PJPGf8aa6RxtPyM9rMS3yRNWcXs21qmJQOYaGhIkjPqGSpt+nDkLAhAgMBAAECgYAaGjGxrL+42p3DYX3gBOpvts4RgDQMI+AnMaxNPHQ09bL7PjmsuUIG96EjQbEbogcSp855/jrQCgzhHRabfto3LADDzhJdGTVNXRptWFMqa9Y6ClNq8OwFn5QWlTxeuIDTc8x6z/XtQE/Wa6x4ud1PSjrBWV04g+aj+/iKGw1DMQJBAN+tVmHThOPQPKSVhK+0j5z8PfZDbfO28tlhtMFEh3V/Q+yM1RwG3jATDDyDVgd6IBGtGqGFZ5a4T0Pevab2zRUCQQCsVSh3pRHXlaZdT410L79KldybJ8z9nD3XL9l8MxoRC7FbcB4VBR2Bq5DVlFrvKYNuyja7gSqnzDxd1lTWplHdAkBfh5J7GXGKMqeTy1/uAvnLHFgCU24kRqCVgwtF99S6s+34m3VxEOXYNmplddpKOzhzFDFphqZlUrZX0EvDgWi5AkAKLSUsm4TINEAUtoPl3oPvRZY3W0xRlY5ZTKwNF39sjkI04hQErb6mT5lH43DTOqJWQn6k5+W67uaJrARqgHvJAkEAlmO1N5uIKUWpsII9FjpU++8LC1Vo18c7fZ0+34s/Q6xkBuh5HbZb1pRpUH1EW1uPE5L/moOK1Hx41AqIRH8Vuw=='
// 		break
// 	case 'test':
// 		publicKey = 'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAMgHs8jCDFy4iRb23JB4JPuYXcpvXP6rghWX+HzXMZoXMmtZq6UfT+B6vAs5CEei/+hYADKekW9BnJ86zkaDQXkZ6pdxH7A1vnsHTtHF+/HNriZDnTkNK+8xx7o89US2B75IfSSbNVCB2ovl8U7fImb2vciLRY3jSKUraGDObUBBAgMBAAECgYBaoMq/EdRCCkXqhqyGNDklWPJdrrkmlZRZrkIiZemOVCY+5yDSrm4lWdZrC0sKEfr6TSzBwoBINST+K8mbvwphQyI/KOlDvLx1WfS5CJXHVpa+zhJH1FPUvmss4oCYozCFQUWovjN2hXyQfOkNP+CiLf+UCXNKaAjuOZlcwo80AQJBAPaO9vS0NcAsMErPwLYbKS3VxHnxP63wr9vLrKYo3TC/g3DiMaXW/2fAUzSNOU1Ymxh3gCAzoU8m6sfsBH1vc6ECQQDPsJ2fTsEc6gzQDKZm7EbiTKzA+wJBbfwTsbCDcpEG1A8h94tjjNmJ4VYssR3UXW508nAaYMUAvBGrMeJs6IihAkEA3Dk8GbvxGrIdfGTuY3oFIPyEHss+LrYBzdexYUS0tLsKw0Q2RkOwI1Kkvxa5LP3MomDyn1Ceb116bZHBPOzUoQJAX0ilF/h2qoBKfoy/LwsJfjs1Kpg+Max28MYduECwfpR9mNTME1EEYLiL45cim1J+IZM0kTWCTFL8PDF3swV/4QJABP1p7+nGl3gKwIxMhZl1DO7pTi04XCWSWjTmNbWN7RJr4YercH862b79Ow/8JLu9Ta67kGLnWLJCh5Tn2IoWtQ=='
// 		break
// 	case 'pre':
// 		publicKey = 'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAMgHs8jCDFy4iRb23JB4JPuYXcpvXP6rghWX+HzXMZoXMmtZq6UfT+B6vAs5CEei/+hYADKekW9BnJ86zkaDQXkZ6pdxH7A1vnsHTtHF+/HNriZDnTkNK+8xx7o89US2B75IfSSbNVCB2ovl8U7fImb2vciLRY3jSKUraGDObUBBAgMBAAECgYBaoMq/EdRCCkXqhqyGNDklWPJdrrkmlZRZrkIiZemOVCY+5yDSrm4lWdZrC0sKEfr6TSzBwoBINST+K8mbvwphQyI/KOlDvLx1WfS5CJXHVpa+zhJH1FPUvmss4oCYozCFQUWovjN2hXyQfOkNP+CiLf+UCXNKaAjuOZlcwo80AQJBAPaO9vS0NcAsMErPwLYbKS3VxHnxP63wr9vLrKYo3TC/g3DiMaXW/2fAUzSNOU1Ymxh3gCAzoU8m6sfsBH1vc6ECQQDPsJ2fTsEc6gzQDKZm7EbiTKzA+wJBbfwTsbCDcpEG1A8h94tjjNmJ4VYssR3UXW508nAaYMUAvBGrMeJs6IihAkEA3Dk8GbvxGrIdfGTuY3oFIPyEHss+LrYBzdexYUS0tLsKw0Q2RkOwI1Kkvxa5LP3MomDyn1Ceb116bZHBPOzUoQJAX0ilF/h2qoBKfoy/LwsJfjs1Kpg+Max28MYduECwfpR9mNTME1EEYLiL45cim1J+IZM0kTWCTFL8PDF3swV/4QJABP1p7+nGl3gKwIxMhZl1DO7pTi04XCWSWjTmNbWN7RJr4YercH862b79Ow/8JLu9Ta67kGLnWLJCh5Tn2IoWtQ=='
// 		break
// 	case 'prod':
// 		publicKey = 'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAK5iKLm3UdE2nayj8rUOpRXYpN/44F3ARQIP0KbXkTJBUCqKCj5pZSSpBiSEi5tFp8uw5AQBLe6lCPnOwQPcBUxtAwlDi1rYJcs0A5aqFU4HOyH17M2agoIwhx3MIfeZ+sAYgjZiw9p0DEzu+rE7/ZMHgTn2qRBYB1UFHCyKWgzdAgMBAAECgYBPNeU73sp6Vu2uQtZ3acyRLNRPrFP2IeT2t8pWTur0QfixKfzXNrarvV897Tsg77X1b0dTjlmX4j0+g6znHOUGfKv18ocSqfEnqDTIDyxJYyNX8Drp7ow+X2oiKBtT2mx1NmnEzi7R/r+maYiM59+P++m7vB1Ija3ruhwwbKHYPQJBAPiXQAEKQWtsTb2z1O3lWHNNpzFNx3+1cuUZr62HLk0zBnYfbpdDSrD+5Czk7II+hwKtsr70Z34EjGGGTfhMcGcCQQCzlLTDSn2TLu3SHde7r4L3zh3I57BLXqjO4mncV0e7jpEqe4T8RgF11NtwrpiLyUgZjbqKgIPHffFowbJcnP4bAkEAqZJ7DXqSb5W8XhgqunDE6jphP0egO6RpkI/5/3QECJMy6Ca+yJ4VeDEXMuyhzKKcdB5KnOmZIyQ1Il18GFEEJwJANOPpUVNRJNY/iRDtBwQsSJvWPeOvEqOwiC47C4BRSjY1HxP+GObtayzj7I4fs5v2tj/93uj25vx662WRCKHcXQJBANcQWOTcJlt/ZaipgxFO7myu9wpgT7TwY4ZCG486jlCvS71VYfb6mJ14G+o/bCT+iespuPQx2/sC4yUImDOAWq8='
// 		break
// }
// 非对称加密方法
export function RSAencrypt(value, publicKey) {
	const jse = new JSEncrypt()

	// 设置公钥

	jse.setPublicKey('-----BEGIN PUBLIC KEY-----' + publicKey + '-----END PUBLIC KEY-----')

	// console.log('加密：'+jse.encrypt(pas))
	return jse.encrypt(value)
}

// 非对称解密方法

export function RSAdencrypt(value, publicKey) {
	const jse = new JSEncrypt()

	// 设置私钥
	jse.setPrivateKey(publicKey || process.env.webConfig.publicKey)
	// console.log('解密：' + jse.decrypt(value))

	return jse.decrypt(value)
}

// crypto对称加密方法
export function Aesencrypt(value, publicKey, iv) {
	// 要先将密钥base64转码
	const key1 = base64code.decode(publicKey)
	iv = iv || ''
	var cipherChunks = []
	var cipher = crypto.createCipheriv('aes-256-ecb', key1, iv)
	cipher.setAutoPadding(true)
	cipherChunks.push(cipher.update(value, 'utf8', 'base64'))
	cipherChunks.push(cipher.final('base64'))
	return cipherChunks.join('')
}

// crypto解密
export function Aesdencrypt(value, publicKey, iv) {
	iv = iv || ''
	// 要先将密钥base64转码
	const key1 = base64code.decode(publicKey)
	var cipherChunks = []
	var decipher = crypto.createDecipheriv('aes-256-ecb', key1, iv)
	decipher.setAutoPadding(true)
	cipherChunks.push(decipher.update(value, 'base64', 'utf8'))
	cipherChunks.push(decipher.final('utf8'))
	return cipherChunks.join('') || value
}

// crypto-js对称解密方法
//
// export function Aesdencrypt(value, publicKey) {
// 	// 要先将密钥base64转码
// 	const key1 = base64code.decode(publicKey)
// 	var key2 = CryptoJS.enc.Utf8.parse(key1)
//
// 	const base64 = CryptoJS.enc.Base64.parse(value)
// 	const src = CryptoJS.enc.Base64.stringify(base64)
// 	var decrypt = CryptoJS.AES.decrypt(src, key2, {
// 		mode: CryptoJS.mode.ECB,
// 		padding: CryptoJS.pad.Pkcs7
// 	})
// 	return CryptoJS.enc.Utf8.stringify(decrypt).toString()
// }
