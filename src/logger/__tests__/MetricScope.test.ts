import sleep from '../../../test/utils/Sleep';
import { metricScope } from '../MetricScope';
import { MetricsLogger } from '../MetricsLogger';

const mockEnvironment = jest.fn();
jest.mock('../../logger/MetricsLoggerFactory', () => {
  return {
    createMetricsLogger: () => new MetricsLogger(mockEnvironment),
  };
});

test('async scope executes handler function', async () => {
  // arrange
  let wasInvoked = false;

  const handler = metricScope(() => async () => {
    await sleep(1);
    wasInvoked = true;
  });

  // act
  await handler();

  // assert
  expect(wasInvoked).toBe(true);
});

test('sync scope executes handler function', async () => {
  // arrange
  let a = false;

  const handler = metricScope(() => () => {
    a = true;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  await handler();

  // assert
  expect(a).toBe(true);
});

test('async scope passes arguments', async () => {
  // arrange
  let arg1 = false;
  let arg2 = '';

  const handler = metricScope(() => async (input1: boolean, input2: string) => {
    await sleep(1);
    arg1 = input1;
    arg2 = input2;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  await handler(true, 'success');

  // assert
  expect(arg1).toBe(true);
  expect(arg2).toBe('success');
});

test('async scope returns child function return value', async () => {
  // arrange
  const expected = true;

  const handler = metricScope(() => async () => {
    return await Promise.resolve(expected);
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  const result = await handler();

  // assert
  expect(result).toBe(expected);
});

test('sync scope passes arguments', async () => {
  // arrange
  let arg1 = false;
  let arg2 = '';

  const handler = metricScope(() => (input1: boolean, input2: string) => {
    arg1 = input1;
    arg2 = input2;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  await handler(true, 'success');

  // assert
  expect(arg1).toBe(true);
  expect(arg2).toBe('success');
});

test('sync scope returns child function return value', async () => {
  // arrange
  const expected = true;

  const handler = metricScope(() => () => {
    return expected;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  const result = await handler();

  // assert
  expect(result).toBe(expected);
});

test('async scope rejects with child function reject value', async () => {
  // arrange
  const expected = true;

  const handler = metricScope(() => async () => {
    return await Promise.reject(expected);
  });

  // act
  const result = handler();

  // assert
  await expect(result).rejects.toBe(expected);
});

test('sync scope rejects with child function error', async () => {
  // arrange
  const expected = true;

  const handler = metricScope(() => () => {
    throw expected;
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  const result = handler();

  // assert
  await expect(result).rejects.toBe(expected);
});

test('async scope flush is still called when child function rejects', async () => {
  // arrange
  mockEnvironment.mockReset();
  const handler = metricScope(() => async () => {
    return await Promise.reject('error');
  });

  // act
  try {
    await handler();
  } catch (e) {
    // ignored
  }

  // assert
  expect(mockEnvironment).toHaveBeenCalled();
});

test('sync scope flush is still called when child function throws', async () => {
  // arrange
  mockEnvironment.mockReset();
  const handler = metricScope(() => () => {
    throw 'error';
  });

  // act
  // the customer can pass in a synchronous function, but we will still return
  // an async function back to the Lambda caller
  try {
    await handler();
  } catch (e) {
    // ignored
  }

  // assert
  expect(mockEnvironment).toHaveBeenCalled();
});
