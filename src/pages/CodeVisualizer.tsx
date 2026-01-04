import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, SkipForward, RotateCcw, 
  Code, Eye, Zap, Settings, ChevronRight,
  ArrowDown, ArrowRight, Box
} from 'lucide-react';

interface ExecutionStep {
  line: number;
  action: string;
  variables: Record<string, any>;
  output?: string;
  highlight?: number[];
  description: string;
}

const ALGORITHMS = {
  bubbleSort: {
    name: 'Bubble Sort',
    code: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}`,
    description: 'Bubble Sort repeatedly swaps adjacent elements if they are in wrong order.',
    generateSteps: (input: number[]): ExecutionStep[] => {
      const arr = [...input];
      const steps: ExecutionStep[] = [];
      
      steps.push({
        line: 1,
        action: 'start',
        variables: { arr: [...arr], i: undefined, j: undefined },
        description: 'Starting bubble sort algorithm',
      });

      for (let i = 0; i < arr.length; i++) {
        steps.push({
          line: 2,
          action: 'outer-loop',
          variables: { arr: [...arr], i, j: undefined },
          description: `Outer loop: i = ${i}`,
        });

        for (let j = 0; j < arr.length - i - 1; j++) {
          steps.push({
            line: 3,
            action: 'inner-loop',
            variables: { arr: [...arr], i, j },
            highlight: [j, j + 1],
            description: `Comparing arr[${j}] (${arr[j]}) with arr[${j + 1}] (${arr[j + 1]})`,
          });

          if (arr[j] > arr[j + 1]) {
            steps.push({
              line: 5,
              action: 'swap',
              variables: { arr: [...arr], i, j, temp: arr[j] },
              highlight: [j, j + 1],
              description: `${arr[j]} > ${arr[j + 1]}, swapping...`,
            });
            
            const temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;

            steps.push({
              line: 7,
              action: 'swapped',
              variables: { arr: [...arr], i, j },
              highlight: [j, j + 1],
              description: `Swapped! Array is now [${arr.join(', ')}]`,
            });
          } else {
            steps.push({
              line: 4,
              action: 'no-swap',
              variables: { arr: [...arr], i, j },
              highlight: [j, j + 1],
              description: `${arr[j]} <= ${arr[j + 1]}, no swap needed`,
            });
          }
        }
      }

      steps.push({
        line: 11,
        action: 'complete',
        variables: { arr: [...arr] },
        description: `Sorting complete! Result: [${arr.join(', ')}]`,
      });

      return steps;
    },
  },
  binarySearch: {
    name: 'Binary Search',
    code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid; // Found!
    } else if (arr[mid] < target) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }
  return -1; // Not found
}`,
    description: 'Binary Search efficiently finds an element in a sorted array by repeatedly dividing the search interval in half.',
    generateSteps: (arr: number[], target: number): ExecutionStep[] => {
      const steps: ExecutionStep[] = [];
      let left = 0;
      let right = arr.length - 1;

      steps.push({
        line: 1,
        action: 'start',
        variables: { arr, target, left: 0, right: arr.length - 1 },
        description: `Searching for ${target} in [${arr.join(', ')}]`,
      });

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        steps.push({
          line: 6,
          action: 'calculate-mid',
          variables: { arr, target, left, right, mid },
          highlight: [mid],
          description: `Checking middle element at index ${mid}: arr[${mid}] = ${arr[mid]}`,
        });

        if (arr[mid] === target) {
          steps.push({
            line: 9,
            action: 'found',
            variables: { arr, target, left, right, mid },
            highlight: [mid],
            description: `Found ${target} at index ${mid}! 🎉`,
          });
          return steps;
        } else if (arr[mid] < target) {
          steps.push({
            line: 11,
            action: 'search-right',
            variables: { arr, target, left: mid + 1, right, mid },
            highlight: Array.from({ length: right - mid }, (_, i) => mid + 1 + i),
            description: `${arr[mid]} < ${target}, searching right half`,
          });
          left = mid + 1;
        } else {
          steps.push({
            line: 13,
            action: 'search-left',
            variables: { arr, target, left, right: mid - 1, mid },
            highlight: Array.from({ length: mid - left }, (_, i) => left + i),
            description: `${arr[mid]} > ${target}, searching left half`,
          });
          right = mid - 1;
        }
      }

      steps.push({
        line: 16,
        action: 'not-found',
        variables: { arr, target, left, right },
        description: `${target} not found in the array`,
      });

      return steps;
    },
  },
  factorial: {
    name: 'Factorial (Recursion)',
    code: `function factorial(n) {
  // Base case
  if (n <= 1) {
    return 1;
  }
  // Recursive case
  return n * factorial(n - 1);
}`,
    description: 'Factorial calculates n! using recursion, demonstrating how recursive calls work.',
    generateSteps: (n: number): ExecutionStep[] => {
      const steps: ExecutionStep[] = [];
      const stack: { n: number; depth: number }[] = [];
      
      const recurse = (val: number, depth: number): number => {
        stack.push({ n: val, depth });
        
        steps.push({
          line: 1,
          action: 'call',
          variables: { n: val, depth, callStack: stack.map(s => `factorial(${s.n})`) },
          description: `Calling factorial(${val}) - depth: ${depth}`,
        });

        if (val <= 1) {
          steps.push({
            line: 3,
            action: 'base-case',
            variables: { n: val, result: 1, depth },
            description: `Base case reached: factorial(${val}) = 1`,
          });
          stack.pop();
          return 1;
        }

        steps.push({
          line: 7,
          action: 'recursive-call',
          variables: { n: val, depth },
          description: `Need to calculate ${val} * factorial(${val - 1})`,
        });

        const subResult = recurse(val - 1, depth + 1);
        const result = val * subResult;

        steps.push({
          line: 7,
          action: 'return',
          variables: { n: val, subResult, result, depth },
          description: `Returning: ${val} * ${subResult} = ${result}`,
        });

        stack.pop();
        return result;
      };

      const finalResult = recurse(n, 0);
      
      steps.push({
        line: 7,
        action: 'complete',
        variables: { n, result: finalResult },
        description: `factorial(${n}) = ${finalResult}`,
      });

      return steps;
    },
  },
};

export default function CodeVisualizer() {
  const [algorithm, setAlgorithm] = useState<keyof typeof ALGORITHMS>('bubbleSort');
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([500]);
  const [customInput, setCustomInput] = useState('[5, 3, 8, 4, 2]');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const algo = ALGORITHMS[algorithm];

  useEffect(() => {
    generateSteps();
  }, [algorithm, customInput]);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, speed[0]);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, speed, steps.length]);

  const generateSteps = () => {
    try {
      let input;
      if (algorithm === 'bubbleSort') {
        input = JSON.parse(customInput);
        setSteps(ALGORITHMS.bubbleSort.generateSteps(input));
      } else if (algorithm === 'binarySearch') {
        const arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
        setSteps(ALGORITHMS.binarySearch.generateSteps(arr, 7));
      } else if (algorithm === 'factorial') {
        setSteps(ALGORITHMS.factorial.generateSteps(5));
      }
      setCurrentStep(0);
    } catch (e) {
      console.error('Invalid input');
    }
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const stepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const currentExecutionStep = steps[currentStep];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
          >
            <Eye className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-display font-bold gradient-text">Code Visualizer</h1>
            <p className="text-muted-foreground">Watch algorithms execute step-by-step 🔍</p>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={algorithm} onValueChange={(v: any) => setAlgorithm(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ALGORITHMS).map(([key, algo]) => (
                  <SelectItem key={key} value={key}>{algo.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant={isPlaying ? 'secondary' : 'default'}
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={stepForward}
                disabled={currentStep >= steps.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={speed}
                onValueChange={setSpeed}
                min={100}
                max={2000}
                step={100}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-16">{speed}ms</span>
            </div>

            <Badge variant="secondary">
              Step {currentStep + 1} / {steps.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Code Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              {algo.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{algo.description}</p>
            <pre className="p-4 rounded-lg bg-zinc-900 text-sm font-mono overflow-x-auto">
              {algo.code.split('\n').map((line, idx) => (
                <div
                  key={idx}
                  className={`px-2 -mx-2 ${
                    currentExecutionStep?.line === idx + 1
                      ? 'bg-primary/30 border-l-2 border-primary'
                      : ''
                  }`}
                >
                  <span className="text-muted-foreground mr-4 select-none">
                    {String(idx + 1).padStart(2, ' ')}
                  </span>
                  <span className="text-green-400">{line}</span>
                </div>
              ))}
            </pre>
          </CardContent>
        </Card>

        {/* Visualization Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Visualization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Step Description */}
            {currentExecutionStep && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-primary/10 border border-primary/30"
              >
                <p className="font-medium">{currentExecutionStep.description}</p>
              </motion.div>
            )}

            {/* Array Visualization for sorting */}
            {currentExecutionStep?.variables?.arr && Array.isArray(currentExecutionStep.variables.arr) && (
              <div className="flex items-end justify-center gap-2 h-48 p-4">
                <AnimatePresence mode="popLayout">
                  {currentExecutionStep.variables.arr.map((val: number, idx: number) => (
                    <motion.div
                      key={`${idx}-${val}`}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative flex flex-col items-center ${
                        currentExecutionStep.highlight?.includes(idx)
                          ? 'z-10'
                          : ''
                      }`}
                    >
                      <motion.div
                        className={`w-10 rounded-t-lg flex items-end justify-center text-xs font-mono text-white pb-1 ${
                          currentExecutionStep.highlight?.includes(idx)
                            ? 'bg-primary'
                            : 'bg-muted-foreground'
                        }`}
                        style={{ height: `${val * 15}px` }}
                        animate={{
                          backgroundColor: currentExecutionStep.highlight?.includes(idx)
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {val}
                      </motion.div>
                      <span className="text-xs text-muted-foreground mt-1">[{idx}]</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Variables Panel */}
            {currentExecutionStep?.variables && (
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Variables
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {Object.entries(currentExecutionStep.variables)
                    .filter(([key]) => key !== 'arr' && key !== 'callStack')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="text-primary">
                          {value === undefined ? 'undefined' : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Call Stack for recursion */}
            {currentExecutionStep?.variables?.callStack && (
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Call Stack</h4>
                <div className="space-y-1">
                  {(currentExecutionStep.variables.callStack as string[]).map((call, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-sm font-mono"
                    >
                      <ChevronRight className="w-3 h-3 text-primary" />
                      {call}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Input */}
      {algorithm === 'bubbleSort' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Custom Input
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="[5, 3, 8, 4, 2]"
                className="font-mono text-sm h-10"
              />
              <Button onClick={generateSteps}>Apply</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
