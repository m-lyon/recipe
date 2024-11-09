import { PATH } from '@recipe/constants';
import { MockedResponses, renderPage } from '@recipe/utils/tests';

import { routes } from '../routes';
import { mocks } from '../__mocks__/graphql';

export const renderComponent = (mockedResponses: MockedResponses = [], route = routes) => {
    return renderPage(route, [...mocks, ...mockedResponses], [PATH.ROOT]);
};
