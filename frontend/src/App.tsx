import React, {useState, useEffect} from 'react';
import { Button, Form, Segment, Table } from 'semantic-ui-react'
import {nussinov} from './api'
import './App.css';

function App() {
  type NussinovData = {
    dpTable: number[][],
    maxScore: number,
    pairings: [number, number][], // array of tuples containing 2 numbers
    dashStructure: string,
  }
  const [rnaStrand, setRnaStrand] = useState("")
  const [minLoopParam, setMinLoopParam] = useState(0)
  const [nussinovData, setNussinovData] = useState<NussinovData>()
  const [rnaCopy, setRnaCopy] = useState("")
  const handleRnaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRnaStrand(event.target.value)
  }
  const handleLoopChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinLoopParam(parseInt(event.target.value))
  }
  const handleClick = async () => {
    const response = await nussinov(rnaStrand, minLoopParam)
    setNussinovData(response)
    setRnaCopy(rnaStrand)
  }
  return (
    <div className="App">
      <h1 className="header">Interactive Nussinov Visualizer</h1>
      <Form>
        <Form.TextArea label='RNA Input Sequence' placeholder='Enter input sequence...' onChange={(event) => handleRnaChange(event)}/>
        <br />
        <Form.Input label="Minimum Length for Hairpin Loops" placeholder='Enter an integer...' onChange={(event) => handleLoopChange(event)}/>
        <br />
        <Button type='submit' onClick={handleClick}>Run Nussinov!</Button>
      </Form>
      {nussinovData && 
        <>
          <h4>Dash Structure: {nussinovData.dashStructure}</h4>
          <h4>Max # of Pairings: {nussinovData.maxScore}</h4>
          <div className="dp-table">
            <Table compact celled definition>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell />
                  {nussinovData && nussinovData.dashStructure.split(" ").map(x => (
                    <Table.HeaderCell>
                      {x}
                    </Table.HeaderCell>
                  ))}
                </Table.Row>
                <Table.Row>
                  <Table.HeaderCell />
                  {nussinovData && rnaCopy.split("").map(x => 
                    <Table.HeaderCell>
                      {x}
                    </Table.HeaderCell>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {nussinovData && nussinovData.dpTable.map((row, idx) => 
                    <Table.Row>
                      <Table.Cell>
                        {rnaCopy[idx]}
                      </Table.Cell>
                      {row.map(score => 
                        <Table.Cell>
                          {score}
                        </Table.Cell>
                      )}
                    </Table.Row>
                  )}
              </Table.Body>
          </Table>
        </div>
        </>}
      </div>
  );
}

export default App;
