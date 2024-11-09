import { PATH } from '@recipe/constants';
import { renderPage } from '@recipe/utils/browser';
import { MockedResponses } from '@recipe/utils/tests';

import { routes } from '../../routes';
import { mocks } from '../../__mocks__/graphql';

export const renderBrowserComponent = (mockedResponses: MockedResponses = [], route = routes) => {
    return renderPage(route, [...mocks, ...mockedResponses], [PATH.ROOT]);
};
