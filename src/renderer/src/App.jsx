import { useState } from 'react'
import {
  Container,
  Box,
  Text,
  Button,
  SimpleGrid,
  Center,
  Alert,
  Spinner,
  Code,
  Flex
} from '@chakra-ui/react'
import { ClipboardIconButton, ClipboardRoot } from '../../components/ui/clipboard'

function App() {
  const [filePaths, setFilePaths] = useState([])
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleFileSelect() {
    const path = await window.electron.selectFiles()
    console.log(path)
    if (path) {
      setFilePaths(path)
      setResult(null)
    }
  }

  async function handleLaunch() {
    if (!filePaths) {
      alert('Please Select Files')
      return
    }
    setIsLoading(true)

    try {
      let totalTokens = 0

      // 各ファイルのトークン数を計算し、合計する
      for (const path of filePaths) {
        const data = await window.electron.processFile(path)
        totalTokens += data.totalTokens
      }

      // 合計トークン数からチャンクサイズを算出
      const chunkSize = Math.min(Math.max(Math.floor(totalTokens * 0.05), 256), 2048)
      const chunkOverlap = Math.floor(chunkSize * 0.3)

      setResult({ totalTokens, chunkSize, chunkOverlap })
    } catch (error) {
      console.error('Generate Chunk Size Value Failed:', error)
      alert('Generate Chunk Size Value Failed.')
    } finally {
      setIsLoading(false) // 処理が完了したらローディング終了
    }
  }

  return (
    <>
      <Container p={5}>
        <Box>
          <SimpleGrid columns={[2, null, 2]} gap="20px">
            <Button onClick={handleFileSelect}>Select Files</Button>
            <Button
              onClick={handleLaunch}
              disabled={filePaths.length === 0 || isLoading}
              px={10}
              ml={2}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" /> Processing...
                </>
              ) : (
                'Launch'
              )}
            </Button>
          </SimpleGrid>
          {filePaths.length > 0 && (
            <Box>
              {filePaths.map((file, index) => (
                <Box key={index} mt={3}>
                  <Alert.Root status="info" colorPalette="gray">
                    <Alert.Content>
                      <Alert.Title>{file}</Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                </Box>
              ))}
            </Box>
          )}
          {result && (
            <Center mt={20}>
              <SimpleGrid columns={[2, null, 3]} gap="40px">
                <Box display={'grid'} placeItems={'center'}>
                  <Flex gap="10px">
                    <Text textStyle={'2xl'}>Total Tokens</Text>
                    <ClipboardRoot value={result.totalTokens}>
                      <ClipboardIconButton />
                    </ClipboardRoot>
                  </Flex>
                  <Text textStyle={'7xl'}>{result.totalTokens}</Text>
                </Box>
                <Box display={'grid'} placeItems={'center'}>
                  <Flex gap="10px">
                    <Text textStyle={'2xl'}>Chunk Size</Text>
                    <ClipboardRoot value={result.chunkSize}>
                      <ClipboardIconButton />
                    </ClipboardRoot>
                  </Flex>
                  <Text textStyle={'7xl'}>{result.chunkSize}</Text>
                </Box>
                <Box display={'grid'} placeItems={'center'}>
                  <Flex gap="10px">
                    <Text textStyle={'2xl'}>Chunk Overlap</Text>
                    <ClipboardRoot value={result.chunkOverlap}>
                      <ClipboardIconButton />
                    </ClipboardRoot>
                  </Flex>
                  <Text textStyle={'7xl'}>{result.chunkOverlap}</Text>
                </Box>
              </SimpleGrid>
            </Center>
          )}
          {filePaths.length == 0 && (
            <Center mt={40} textStyle={'xl'}>
              <Text>
                Click <Code>Select Files</Code> to select files.
              </Text>
            </Center>
          )}
        </Box>
        <Box as="footer" position={'fixed'} bottom={0} left={0} mb={5} px={5} width={'full'}>
          <Alert.Root status="info" colorPalette="gray">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Support File</Alert.Title>
              <Alert.Description>xlsx, pptx, docx, pdf, csv, md, txt, log, json</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        </Box>
      </Container>
    </>
  )
}

export default App
