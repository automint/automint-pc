(function() {
    angular.module('altairApp')
        .controller('treatmentsAddCtrl', TreatmentsAdd);

    TreatmentsAdd.$inject = ['$state', 'treatmentFactory'];

    function TreatmentsAdd($state, treatmentFactory) {
        var vm = this;
        //  declarations and mappings
        vm.save = save;
        //  define operation mode to disbable particular fields in different modes
        vm.operationMode = "add";
        //  define object to track treatment details
        vm.treatment = {
            details: '',
            rate: {
                smallcar: '',
                mediumcar: '',
                largecar: '',
                xlargecar: '',
                default: ''
            }
        }

        //  save data to pouchDB instance
        function save() {
            treatmentFactory.saveTreatment(vm.treatment, vm.operationMode).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Treatment has been added.", {
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.treatments.all");
                } else {
                    UIkit.notify("Treatment can not be added at moment. Please Try Again!", {
                        status: 'info',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Treatment can not be added at moment. Please Try Again!", {
                    status: 'info',
                    timeout: 3000
                });
            })
        }
    }
})();