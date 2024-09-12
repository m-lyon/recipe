import { ROOT_PATH } from '@recipe/constants';
import { MockedResponses, renderPage } from '@recipe/utils/tests';

import { routes } from '../routes';
import { mocks } from '../__mocks__/graphql';

export const renderComponent = (mockedResponses: MockedResponses = [], route = routes) => {
    renderPage(route, [...mocks, ...mockedResponses], [ROOT_PATH]);
};
