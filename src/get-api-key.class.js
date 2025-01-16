class GetApiKey {

  constructor (worker) {
    this.KV = worker.KV
  }

  async execute() {
    try {
      return {
        result: 'ok'
      }
    } catch (error) {
      throw new Error(error)
    }
  }

}

export default GetApiKey
