export function useModal() {
  const showLogin = useState('showLogin', () => false)
  const showBooking = useState('showBooking', () => false)
  const showServiceDetail = useState('showServiceDetail', () => false)
  const showArtistDetail = useState('showArtistDetail', () => false)
  const showMyAppointments = useState('showMyAppointments', () => false)
  const showImagePreview = useState('showImagePreview', () => false)
  const previewImageUrl = useState('previewImageUrl', () => '')
  const selectedServiceId = useState<number | null>('selectedServiceId', () => null)
  const selectedArtistId = useState<number | null>('selectedArtistId', () => null)

  function openLogin() { showLogin.value = true }
  function closeLogin() { showLogin.value = false }

  function openBooking() { showBooking.value = true }
  function closeBooking() { showBooking.value = false }

  function openServiceDetail(id: number) {
    selectedServiceId.value = id
    showServiceDetail.value = true
  }
  function closeServiceDetail() {
    showServiceDetail.value = false
    selectedServiceId.value = null
  }

  function openArtistDetail(id: number) {
    selectedArtistId.value = id
    showArtistDetail.value = true
  }
  function closeArtistDetail() {
    showArtistDetail.value = false
    selectedArtistId.value = null
  }

  function openMyAppointments() { showMyAppointments.value = true }
  function closeMyAppointments() { showMyAppointments.value = false }

  function openImagePreview(url: string) {
    previewImageUrl.value = url
    showImagePreview.value = true
  }
  function closeImagePreview() {
    showImagePreview.value = false
    previewImageUrl.value = ''
  }

  function closeAll() {
    closeLogin()
    closeBooking()
    closeServiceDetail()
    closeArtistDetail()
    closeMyAppointments()
    closeImagePreview()
  }

  return {
    showLogin, showBooking, showServiceDetail, showArtistDetail,
    showMyAppointments, showImagePreview, previewImageUrl,
    selectedServiceId, selectedArtistId,
    openLogin, closeLogin, openBooking, closeBooking,
    openServiceDetail, closeServiceDetail,
    openArtistDetail, closeArtistDetail,
    openMyAppointments, closeMyAppointments,
    openImagePreview, closeImagePreview,
    closeAll,
  }
}
