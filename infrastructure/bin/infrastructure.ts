#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RealtimeDashboardStack } from '../lib/realtime-dashboard-stack';

const app = new cdk.App();
new RealtimeDashboardStack(app, 'RealtimeDashboardStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
