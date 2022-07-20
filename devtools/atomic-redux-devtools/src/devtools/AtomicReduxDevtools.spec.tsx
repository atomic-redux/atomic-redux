import { render } from '@testing-library/react';
import { AtomicReduxDevtools } from './AtomicReduxDevtools';

describe('AtomicReduxDevtools', () => {
    it('should pass', () => {
        render(<AtomicReduxDevtools />);
        expect(true).toBeTruthy();
    });
});
