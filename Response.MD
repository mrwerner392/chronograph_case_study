# PART 1

#1.
```
SELECT documents.id
FROM documents
WHERE NOT EXISTS (SELECT pages.id FROM pages WHERE pages.document_id = documents.id)
```

#2.
```
SELECT reports.title, COUNT(pages.id)
FROM reports
INNER JOIN documents ON documents.report_id = reports.id
INNER JOIN pages ON pages.document_id = documents.id
GROUP BY reports.id
```

#3.

For this problem I am assuming: 
1. that all comment objects have the same structure regardless of which type of object they belong to.
2. that people cannot comment on comments, though I don't think my solution would need to change if that were allowed.
3. that there is a model `users` with a one-to-many relationship with `comments`, as each comment would likely belong to a user in a real-world implementation.

I think there are a couple main considerations here:
- Simplicity of schema
- Efficiency of accessing comments

The way I would probably do this given my prior experience is by creating a new database table `comments`, which would have the following columns:
- `body`: string or text
- `type`: string
- `parent_id`: integer
- `user_id`: integer

The `type` tells us if the comment belongs to a report, a document, or a page and then the `parent_id` holds the id of that parent object. This keeps the database simple and scalable (as opposed to creating 3 tables for each of the possible comment types) and while it does make accessing comments for specific reports/documents/pages a little more difficult, this feels like an acceptable trade-off.

Note: I didn't know about table inheritance before doing this, but I am reading about it and it seems like it could be a possible fit for this problem. I think in this case we would create a `comments` table, which would ultimately be empty, and then tables for `report_comments`, `document_comments`, and `page_comments` which would all inherit from `comments`. The `comments` table would have the `body` and `user_id` columns, and then each of the specific comment tables would have either `report_id`, `document_id`, or `page_id`. However, I am not sure about the trade-off here between gains in SQL efficiency vs increase in schema complexity. It feels like this solution could be an over-complication, but maybe we can discuss this more.

---

# PART 2

Both prompts #1 and #2 here require that we know which report each page belongs to. In order to simplify logic and speed up the algos, I think it makes sense to attach the report_id to each page object when we first get the data, using a function like this:

```
const addReportIdToPage = store => {
  if (typeof store.page === 'object' && typeof store.document === 'object') {
    for (const page of Object.values(store.page)) {
      page.report_id = store.document[page.document_id].report_id
    }
  }
}
```

The solutions to the prompts below assume we have updated `store` in this way so that each page object has a report_id attribute. (Note: If we are pulling search results from an API as in prompt #3 this may be an unnecessary first step.)

#1.
```
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
```

#2.
```
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
```

#3.

a. We could use async/await here, so the search API request might look like:
```
const searchReports = async query => {
  try {
    const response = await fetch('endpoint', {*fetch configuration object*})
    const data = await response.json()
    if (*check for ok response*) {
      return data
    } else {
      return Promise.reject('some error message')
    }
  } catch (e) {
    return Promise.reject('some error message')
  }
}
```

Then we could invoke `searchReports` and append a `.then()` and `.catch()` to handle the results or error:
```
searchReports('some query')
.then(res => {
  *handle res*
})
.catch(error => {
  *handle error*
})
```

Now, assuming we would want to make several different API requests, we could generalize the above `searchReports` function so that we can use it to make any request. That might look something like this:
```
const makeFetch = async (endpoint, config) => {
  try {
    const response = await fetch('endpoint', {*fetch configuration object*})
    const data = await response.json()
    if (*check for ok response*) {
      return data
    } else {
      return Promise.reject('some error message')
    }
  } catch (e) {
    return Promise.reject('some error message')
  }
}
```

And then for our search functionality we would invoke it like this:
```
makeFetch('search endpoint', {*config object for search request*})
.then(res => {
  *handle res*
})
.catch(error => {
  *handle error*
})
```

b. Looking at the above example, if the API returns something like a 404 error, we can catch that in the `if (/*check for ok response*/) ... else` statement and then return some sort of error message which would then be handled by our `.catch()`. We may want to expand this `if...else` statement to look for specific error codes. If there is a server error, that will be caught by our `try...catch` and again, we can return an error of our choosing to be handled by the `.catch()`. Either way we would want to notify the user about the specific error at this point.