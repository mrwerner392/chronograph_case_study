const fetch = require('node-fetch')

const addReportIdToPage = store => {
  if (typeof store.page === 'object' && typeof store.document === 'object') {
    for (const page of Object.values(store.page)) {
      page.report_id = store.document[page.document_id].report_id
    }
  }
}

// #1
const getPageCountByReportId = store => {
  const pageCountByReportId = {}
  if (typeof store.page === 'object') {
    for (const page of Object.values(store.page)) {
      const reportId = page.report_id
      pageCountByReportId[reportId] = pageCountByReportId[reportId] + 1 || 1
    }
  }
  return pageCountByReportId
}

// #2
const searchReports = (store, query) => {
  if (typeof query !== 'string' || query === '') return []

  const regexp = new RegExp(query, 'i')
  const resultIds = []

  // search in report titles
  if (typeof store.report === 'object') {
    for (const report of Object.values(store.report)) {
      if (searchInText(regexp, report.title)) resultIds.push(report.id)
    }
  }

  // search in document names
  if (typeof store.document === 'object') {
    for (const document of Object.values(store.document)) {
      if (resultIds.indexOf(document.report_id) > -1) continue
      if (searchInText(regexp, document.name)) resultIds.push(document.report_id)
    }
  }

  // search in page bodies and footnotes
  if (typeof store.page === 'object') {
    for (const page of Object.values(store.page)) {
      if (resultIds.indexOf(page.report_id) > -1) continue
      if (searchInText(regexp, page.body) || searchInText(regexp, page.footnote)) resultIds.push(page.report_id)
    }
  }

  return resultIds.map(id => store.report[id])
}

const searchInText = (regexp, text) => {
  return text.match(regexp)
}


// fetch('http://localhost:3000/data')
// .then(res => res.json())
// .then(res => {
//   const store = res

//   addReportIdToPage(store)

//   console.log(getPageCountByReportId(store))
//   console.log(searchReports(store, 'ten'))

// })


// #3
const makeFetch = async (endpoint, config) => {
  try {
    const response = await fetch('endpoint', {/*fetch configuration object*/})
    const data = await response.json()
    if (response.ok) {
      return data
    } else {
      return Promise.reject('some error message')
    }
  } catch (e) {
    return Promise.reject('some error message')
  }
}

makeFetch('search endpoint', {/*config object for search request*/})
.then(res => {
  /*handle res*/
})
.catch(error => {
  /*handle error*/
})