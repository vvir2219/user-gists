import parseLinkHeader from "parse-link-header"

export const GITHUB_API_BASE = "http://api.github.com"
// export const GITHUB_API_BASE = "https://cors-anywhere.herokuapp.com/" + "http://api.github.com"

export const API_USER_GISTS = (username, {page} = {}) => {
  return `/users/${username}/gists` + (page ? `?page=${page}` : "")
}

export const number_of_pages = (headers) => {
  const linkHeader = headers.get("link")
  if (!linkHeader) return 0

  const parsed = parseLinkHeader(linkHeader)
  if (!parsed.hasOwnProperty("last"))
    return Number(parsed.prev.page) + 1

  return Number(parsed.last.page)
}

export const url_number_of_pages = async (url) => {
  const res = await fetch(url, {method: 'HEAD'})

  return number_of_pages(res.headers)
}
