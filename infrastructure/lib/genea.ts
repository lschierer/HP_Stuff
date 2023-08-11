import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { aws_codecommit as codecommit } from 'aws-cdk-lib';

class GeneaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      const gwrepo = new codecommit.Repository(this, 'GWRepo', {
        repositoryName: 'HP_Genea_Repo',
        description: 'Genea from https://www.genea.app/ for use by the HP stuff',
      });

    }
}

export class GeneaStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const HPGenea = new GeneaStack(this, 'HPGenea');
  }
}

// vim: shiftwidth=2:tabstop=2:expandtab 

