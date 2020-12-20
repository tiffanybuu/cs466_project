import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import { Button, Dimmer, Form, Grid, Header, Icon, Loader, Ref, Segment, Table } from 'semantic-ui-react'
// @ts-ignore
import { Slider } from "react-semantic-ui-range";
import distinctColors from 'distinct-colors';

import { nussinov, NussinovData } from './api'
import { traceback, Step } from './traceback';
import './App.css';

const ANIMATION_STEP_DURATION = 1250;
const ANIMATION_TRANSITION_DURATION = 500;

function shuffle(arr: any[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function App() {
  const [loading, setLoading] = useState(false)
  const [rnaStrand, setRnaStrand] = useState("")
  const [rnaCopy, setRnaCopy] = useState("")
  const [minLoopParam, setMinLoopParam] = useState(0)
  const sliderSettings = {
    min: 0,
    max: 30,
    step: 1,
    onChange: (value: number) => {
      setMinLoopParam(value)
    }
  }
  
  const [nussinovData, setNussinovData] = useState<NussinovData>()
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1); // -1 will cause entire backtrace to be displayed

  const [animationInterval, setAnimationInterval] = useState<number|null>(null);
  const isAnimationPlaying = animationInterval !== null;

  const tableCells = useRef<HTMLElement[]>([]);

  const calculateNussinov = async () => {
    const response = await nussinov(rnaStrand, minLoopParam);
    setSteps(traceback(rnaStrand, response.dpTable));
    setNussinovData(response)
    setRnaCopy(rnaStrand)
    setMinLoopParam(minLoopParam)
    tableCells.current = new Array(rnaStrand.length**2);
  }

  const handleRnaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRnaStrand(event.target.value)
  }
  const handleLoopChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(event.target.value)
    if (!value) {
      value = 0
    }
    setMinLoopParam(value)
  }
  const handleClick = async () => {
    setLoading(true)
    await calculateNussinov()
    setLoading(false)
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

  // scroll current cell into view as animation plays (as currentStep is updated)
  useEffect(() => {
    const step = steps[currentStep];
    if (step) {
      const cells = Object.keys(step);
      const [i, j] = cells[cells.length - 1].split('-').map(x => Number(x));
      tableCells.current[i*rnaCopy.length + j]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [steps, currentStep, rnaCopy]);

  const cellsToHighlight = useMemo(() => {
    const cells: { [cellKey: string]: number } = {}
    for (const [i, step] of steps.entries()) {
      // if current step is -1, then we want to highlight all the cells, otherwise we just want the current step
      if (i <= currentStep || currentStep === -1) {
        for (const [cellKey, color] of Object.entries(step)) {
          // cellKey is of format `${row}-${column}`
          cells[cellKey] = color;
        }
      }
    }
    return cells;
  }, [steps, currentStep]);

  const colors = useMemo(() => {
    let maxColorIndex = 0;
    for (const step of steps) {
      for (const colorIndex of Object.values(step)) {
        maxColorIndex = Math.max(maxColorIndex, colorIndex);
      }
    }

    return shuffle(distinctColors({
      count: (maxColorIndex + 1) + 5,
      lightMin: 40,
      lightMax: 80,
      chromaMin: 10,
    }).map(color => color.hex()));
  }, [steps]);

  const getTableCell = (score: number, i: number, j: number) => {
    const style: React.CSSProperties = {
      transition: `background-color ${ANIMATION_TRANSITION_DURATION/1000}s`
    };

    const colorIndex = cellsToHighlight[`${i}-${j}`];
    if (colorIndex !== undefined) {
      style.backgroundColor = colors[colorIndex];
    }

    return (
      <Ref innerRef={(el: HTMLElement) => tableCells.current[i * rnaCopy.length + j] = el}>
        <Table.Cell style={style}>
          {score}
        </Table.Cell>
      </Ref>
    );
  }

  return (
    <div className="App">
      <Grid>
        <Grid.Column width={3}>
          <div className="sidebar">
            <Form>
              <p><b>RNA Input Sequence</b></p>
              <Form.TextArea placeholder='Enter input sequence...' value={rnaStrand} onChange={(event) => handleRnaChange(event)} />
              <p><b>Minimum Hairpin Loop Length</b></p>
              <Form.Input
                placeholder='Enter an integer or use slider below...'
                value={minLoopParam}
                onChange={(event) => handleLoopChange(event)}/>
              <br />
              <div className="slider">
                  <Slider discrete value={minLoopParam} color="red" settings={sliderSettings} />
                  <p className="slider-left">0</p>
                  <p className="slider-right">30</p>
              </div>
              <p>{minLoopParam}</p>
              <Button onClick={handleClick}>Run Nussinov!</Button>
            </Form>
            <br />
            {nussinovData &&
              <Segment>
                <p><b>Dash Structure:</b></p>
                <p>{nussinovData.dashStructure}</p>
                <p><b>Max Pairings:</b></p>
                <p>{nussinovData.maxScore}</p>
                <p><b>Play Animation</b></p>
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
              </Segment>
            }
          </div>
        </Grid.Column>

        <Grid.Column width={13} className="right-column" stretched>
          <h1 className="header">Interactive Nussinov Visualizer</h1>

          {nussinovData && !loading ?
          <>
            <div className="dp-table">
              <Table textAlign="center" compact celled definition>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell />
                    {nussinovData.dashStructure.split(" ").map(x => (
                      <Table.HeaderCell className="top-header-cell">
                        {x}
                      </Table.HeaderCell>
                    ))}
                  </Table.Row>
                  <Table.Row>
                    <Table.HeaderCell />
                    {rnaCopy.split("").map(x =>
                      <Table.HeaderCell className="top-header-cell second-row">
                        {x}
                      </Table.HeaderCell>
                    )}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {nussinovData.dpTable.map((row, i) =>
                    <Table.Row>
                      <Table.Cell className="left-header-cell">
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
          </> :
          <div className="dp-table">
            <Segment placeholder>
              {loading ? 
                <Dimmer active inverted>
                  <Loader size='massive'>Loading...</Loader> 
                </Dimmer>
                :
                <Header icon>
                  <Icon name='table' />
                  Traceback table will be displayed here.
                </Header>
              }
            </Segment>
          </div>
        }          
        </Grid.Column>
      </Grid>
    </div>
  );
}

export default App;
