import React, {useState, useEffect, useMemo} from 'react';
import { Button, Form, Segment, Table } from 'semantic-ui-react'
import { nussinov, NussinovData } from './api'
import { traceback, Step } from './traceback';
// @ts-ignore
import { Animated } from 'react-web-animation';
import './App.css';

function App() {
  const [rnaStrand, setRnaStrand] = useState("")
  const [minLoopParam, setMinLoopParam] = useState(0)
  const [nussinovData, setNussinovData] = useState<NussinovData>()
  const [rnaCopy, setRnaCopy] = useState("")
  const [steps, setSteps] = useState<Step[]>([]); // currently just a list of cell indices, but will eventually be animation steps

  const handleRnaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRnaStrand(event.target.value)
  }
  const handleLoopChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinLoopParam(parseInt(event.target.value))
  }
  const handleClick = async () => {
    const response = await nussinov(rnaStrand, minLoopParam);
    setSteps(traceback(rnaStrand, response.dpTable));
    setNussinovData(response)
    setRnaCopy(rnaStrand)
  }

  const cellsToHighlight = useMemo(() => {
    const cells = steps.map(([i, j]) => `${i}-${j}`); // convert tuples to strings so that they're constants
    return new Set(cells); // use Set to allow efficient existence check
  }, [steps]);

  const keyFrames = useMemo(() => {
    // const frames = 
    // return steps.map(([i, j]) => (
    //   { transform: `translate(calc(${j * 100}% + ${j}px), calc(${i * 100}% + ${j}px))` }
    // ));
    return [0, 1, 2, 3, 4].map(x => ([
      { transform: `translateX(calc(${x * 100}% + ${1.39*x}px))`, offset: .2 * x },
      { transform: `translateX(calc(${x * 100}% + ${1.39*x}px))`, offset: .2 * x + .1},
    ])).flat();
  }, [steps]);

  const timing = {
    duration: steps.length * 1000,
    // direction: 'alternate',
    iterations: Infinity,
  };

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
                {nussinovData && nussinovData.dpTable.map((row, i) => 
                    <Table.Row>
                      <Table.Cell>
                        {rnaCopy[i]}
                      </Table.Cell>
                      {row.map((score, j) => 
                        <Table.Cell style={{ backgroundColor: cellsToHighlight.has(`${i}-${j}`) ? 'pink' : '', position: 'relative'}}>
                          {score}
                          {i == 0 && j == 0 && (
                            // <div style={{ backgroundColor: 'rgba(255, 0, 0, .5)', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', transform: 'translateY(100%)', zIndex: 100 }}>
                            //   {score}
                            // </div>
                            <Animated.div
                              style={{ backgroundColor: 'rgba(255, 0, 0, .5)', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', zIndex: 100 }}
                              keyframes={keyFrames}
                              timing={timing}
                            />
                          )}
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
