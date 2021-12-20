import { useState, useEffect } from 'react'
import { GITHUB_API_BASE, API_USER_GISTS, number_of_pages, url_number_of_pages } from './api';
import ReactPaginate from 'react-paginate';

import './DisplayUserGists.css'

function GistsSearch({onClick}) {
  const [searchTerm, setSearchTerm] = useState("")

  const submit = () => {
    onClick(searchTerm.trim())
    setSearchTerm("")
  }

  return (
    <div>
      <input type="text" placeholder='Search user gists...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
      <input type="button" value="Search" onClick={submit} />
    </div>
  )
}

function GistItem({ gist }) {
  const files = Object.values(gist.files)
  const filetypes = Array.from(new Set(files.map(f => f.type)))

  const [loading, setLoading] = useState(true)
  const [lastForks, setLastForks] = useState([])
  const [filesData, setFilesData] = useState([])

  useEffect(async () => {
    setLoading(true)

    const url = gist.forks_url
    const pagesCount = await url_number_of_pages(url)

    let forks = await fetch(url + `?page=${pagesCount}`).then(res => res.json())

    if (pagesCount > 0 && forks.length < 3) {
      forks = (await fetch(url + `page=${pagesCount-1}`).then(res => res.json())).concat(forks)
    }

    const dataForFiles = []
    files.forEach(async file => {
      dataForFiles.push([file.filename, await fetch(file.raw_url).then(res => res.text())])
    })
    setFilesData(dataForFiles)

    setLastForks(forks.slice(-3))
    setLoading(false)
  }, [gist.node_id])

  if (loading) return <>Loading...</>

  console.log(filesData)

  let displayedFiles = []
  for (let [filename, fileData] in filesData) {
    displayedFiles.push(
      <li key={filename}>
        <div>{filename}</div>
        <p>{fileData}</p>
      </li>)
  }

  return (
    <>
      <ul>
        {filetypes.map(ft => <li key={ft}>{ft}</li>)}
      </ul>
      <a href={gist.html_url}>{files[0].filename}</a>
      <ul>
        {displayedFiles}
      </ul>
      <ul>
        {lastForks.map(fork => <li key={fork.node_id}>{fork.owner.login}</li>)}
      </ul>
    </>
  )
}

function GistsList({loading, userData: {data, error}}) {
  if (loading) return <div>Loading...</div>
  if (error) return <div>{error.message}</div>

  const displayGist = (gist) => {
    return (
      <li key={gist.node_id}>
        <GistItem gist={gist} />
      </li>
    )
  }

  return (
    <ul>
        {data.map(displayGist)}
    </ul>
  )
}

function PaginatedGistsList({ username, page = 0 }) {
  const [userData, setUserData] = useState({data: [], error: null})
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const url = GITHUB_API_BASE + API_USER_GISTS(username, {page: currentPage})

  useEffect(async () => {
    setLoading(true)
    try {
      const res = await fetch(url)
      const data = await res.json()

      if (res.ok) {
        setUserData({ data })
        setPageCount(number_of_pages(res.headers))
      } else {
        setUserData({ error: data})
      }

    } catch (error) {
      setUserData({ error })
    } finally {
      setLoading(false)
    }
  }, [username, currentPage])

  const handlePageChange = (event) => {
    setCurrentPage(event.selected+1)
  }

  return (
    <div>
      <GistsList loading={loading} userData={userData} />
      <ReactPaginate
        nextLabel="next >"
        onPageChange={handlePageChange}
        pageRangeDisplayed={5}
        marginPagesDisplayed={2}
        pageCount={pageCount}
        previousLabel="< previous"
        pageClassName="page-item"
        pageLinkClassName="page-link"
        previousClassName="page-item"
        previousLinkClassName="page-link"
        nextClassName="page-item"
        nextLinkClassName="page-link"
        breakLabel="..."
        breakClassName="page-item"
        breakLinkClassName="page-link"
        containerClassName="pagination"
        activeClassName="active"
        renderOnZeroPageCount={null}
      />
    </div>
  )
}

// Top component
export default () => {
  const [username, setUsername] = useState("")

  return (
    <div>
      <GistsSearch onClick={setUsername} />
      {username === "" ? <></> : <PaginatedGistsList username={username} />}
    </div>
  )
}
