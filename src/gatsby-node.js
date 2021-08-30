const NetlifyAPI = require('netlify')

exports.pluginOptionsSchema = ({ Joi }) =>
  Joi.object({
    apiKey: Joi.string().required().description('Your Netlify access token'),
    opts: Joi.object().description('The optional options you can pass to the Netlify Instance'),
  })

exports.sourceNodes = async ({ actions, createNodeId, createContentDigest, reporter }, { apiKey, opts = {} }) => {
  const { createNode } = actions

  const client = new NetlifyAPI(apiKey, opts)

  const nodeHelper = (input, name) => {
    input.netlify_id = input.id
    input.id = createNodeId(`gatsby-source-netlify-${input.netlify_id}`)

    const node = {
      ...input,
      parent: null,
      children: [],
      internal: {
        type: `Netlify${name}`,
      },
    }

    node.internal.content = JSON.stringify(node)
    node.internal.contentDigest = createContentDigest(node)

    createNode(node)
  }

  try {
    const sites = await client.listSites()
    const user = await client.getCurrentUser()

    sites.forEach((site) => nodeHelper(site, 'Sites'))
    nodeHelper(user, 'User')
  } catch (e) {
    reporter.panicOnBuild(`Error creating the nodes for gatsby-source-netlify`, e)
  }
}
