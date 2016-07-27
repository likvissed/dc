module ServicesHelper

  def network_inputs(index:, id: nil, destroy: nil, segment: nil, vlan: nil, dns_name: nil)
    [
      hidden_field_tag("service[service_networks_attributes][#{index}][id]", id),
      hidden_field_tag("service[service_networks_attributes][#{index}][_destroy]", destroy),
      hidden_field_tag("service[service_networks_attributes][#{index}][segment]", segment, value: "{{ networks[#{index}].segment }}", "ng-model": "networks[#{index}].segment"),
      hidden_field_tag("service[service_networks_attributes][#{index}][vlan]", vlan, value: "{{ networks[#{index}].vlan }}", "ng-model": "networks[#{index}].vlan"),
      hidden_field_tag("service[service_networks_attributes][#{index}][dns_name]", dns_name, value: "{{ networks[#{index}].dns_name }}", "ng-model": "networks[#{index}].dns_name")
    ].join.html_safe
  end

end
