import React, {useState, useEffect, useMemo, useCallback} from 'react';
import { Button, Form, Table } from 'semantic-ui-react'
import { nussinov, NussinovData } from './api'
import { traceback, Step } from './traceback';
import './App.css';

const ANIMATION_STEP_DURATION = 1250;
const ANIMATION_TRANSITION_DURATION = 500;

function App() {
  const [rnaStrand, setRnaStrand] = useState("")
  const [minLoopParam, setMinLoopParam] = useState(0)
  const [nussinovData, setNussinovData] = useState<NussinovData>()
  const [rnaCopy, setRnaCopy] = useState("")
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1); // -1 will cause entire backtrace to be displayed

  const [animationInterval, setAnimationInterval] = useState<number|null>(null);
  const isAnimationPlaying = animationInterval !== null;

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

  const handlePlayAnimation = useCallback(() => {
    const interval = window.setInterval(() => setCurrentStep(step => step + 1), ANIMATION_STEP_DURATION);
    setAnimationInterval(interval);
    setCurrentStep(step => step + 1);
  }, []);

  const handlePauseAnimation = useCallback(() => {
    if (animationInterval !== null) {
      window.clearInterval(animationInterval);
      setAnimationInterval(null);
    }
  }, [animationInterval])

  const handleStopAnimation = useCallback(() => {
    handlePauseAnimation();
    setCurrentStep(-1);
  }, [handlePauseAnimation])

  // we want to ensure that the current step index is always between [-1, steps.length - 1]
  // (-1 corresponds to displaying the entire backtrace)
  const cycleCurrentStep = useCallback((step: number) => {
    // we effectively want to cycle it in an array of size steps.length + 1, and then subtract 1
    const n = steps.length + 1;
    while (step + 1 < 0) {
      step += n;
    }
    return (step + 1) % (steps.length + 1) - 1;
  }, [steps.length])

  const handleStepForward = useCallback(() => {
    handlePauseAnimation();
    setCurrentStep(step => cycleCurrentStep(step + 1));
  }, [cycleCurrentStep, handlePauseAnimation])

  const handleStepBackward = useCallback(() => {
    handlePauseAnimation();
    setCurrentStep(step => cycleCurrentStep(step - 1));
  }, [cycleCurrentStep, handlePauseAnimation]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.target === document.body) {
        if (e.key === ' ') {
          if (isAnimationPlaying) {
            handlePauseAnimation();
          } else {
            handlePlayAnimation();
          }
        }
        else if (e.key === 'ArrowRight') {
          handleStepForward();
        }
        else if (e.key === 'ArrowLeft') {
          handleStepBackward();
        }
      }
    }
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    }
  }, [handlePauseAnimation, handlePlayAnimation, handleStepBackward, handleStepForward, isAnimationPlaying]);

  // once the animation completes a full run, stop the interval
  useEffect(() => {
    if (currentStep >= steps.length) {
      handleStopAnimation();
    }
  }, [steps, currentStep, handleStopAnimation]);

  const cellsToHighlight = useMemo(() => {
    const cells = steps.map(([i, j]) => `${i}-${j}`); // convert tuples to strings so that they're constants
    return new Set(cells); // use Set to allow efficient existence check
  }, [steps]);

  const getTableCell = (score: number, i: number, j: number) => {
    const style: React.CSSProperties = {
      transition: `background-color ${ANIMATION_TRANSITION_DURATION/1000}s`
    };

    if (steps[currentStep]) { // if the current step exists, display that step
      const [row, column] = steps[currentStep];
      if (row === i && column === j) {
        style.backgroundColor = 'pink';
      }
    } else { // otherwise (i.e. if currentStep == -1), display the entire backtrace
      if (cellsToHighlight.has(`${i}-${j}`)) {
        style.backgroundColor = 'pink';
      }
    }

    return (
      <Table.Cell style={style}>
        {score}
      </Table.Cell>
    );
  }

  return (
    <div className="App">
      <h1 className="header">Interactive Nussinov Visualizer</h1>
      <Form>
        <Form.TextArea label='RNA Input Sequence' placeholder='Enter input sequence...' onChange={(event) => handleRnaChange(event)} />
        <br />
        <Form.Input label="Minimum Length for Hairpin Loops" placeholder='Enter an integer...' onChange={(event) => handleLoopChange(event)} />
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
                      getTableCell(score, i, j)
                    )}
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>

          <br />
          <Button.Group>
            <Button icon="chevron left" title="Step Backward (Left Arrow Key)" onClick={handleStepBackward} />
            <Button icon="stop" title="Stop Animation" onClick={handleStopAnimation} />
            <Button
              icon={isAnimationPlaying ? 'pause' : 'play'}
              title={`${isAnimationPlaying ? 'Pause' : 'Play'} Animation (Space)`}
              onClick={isAnimationPlaying ? handlePauseAnimation : handlePlayAnimation}
            />
            <Button icon="chevron right" title="Step Forward (Right Arrow Key)" onClick={handleStepForward} />
          </Button.Group>
          <br /><br />
        </>
      }
    </div>
  );
}

export default App;
