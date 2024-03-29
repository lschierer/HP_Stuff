import { AstroSite, type StackContext } from "sst/constructs";

export function HPAstroSite({stack}: StackContext) {
    const site = new AstroSite(stack, "site", {
      customDomain: {
        domainName: stack.stage === "prod" ? "hpfan.schierer.org" : `${stack.stage}.hpfan.schierer.org`,
        domainAlias: stack.stage === "prod" ? "www.hpfan.schierer.org" : `www.${stack.stage}.hpfan.schierer.org`,
        hostedZone: "schierer.org",
      },
  
    });
    
    stack.addOutputs({
      url: site.customDomainUrl || site.url,
    });

    return {
      site
    };
}