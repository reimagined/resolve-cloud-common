const listCloudFrontOriginAccessIdentities = require('./listCloudFrontOriginAccessIdentities')

const getCloudFrontOriginAccessIdentity = async ({ Region, Comment, Marker }) => {
  const { CloudFrontOriginAccessIdentityList } = await listCloudFrontOriginAccessIdentities({
    Region,
    Marker
  })

  const { IsTruncated, NextMarker, Items } = CloudFrontOriginAccessIdentityList

  const identity = Items.find(item => item.Comment === Comment)

  if (identity != null) {
    return {
      id: identity.Id,
      s3UserId: identity.S3CanonicalUserId
    }
  }

  if (IsTruncated) {
    return getCloudFrontOriginAccessIdentity({
      Region,
      Comment,
      Marker: NextMarker
    })
  }

  return null
}

module.exports = getCloudFrontOriginAccessIdentity
